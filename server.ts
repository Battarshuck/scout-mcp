import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  // CallToolRequestSchema,
  // ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// create a server instance
const server = new McpServer({
    name: "nmap agent",
    description: "A tool for scanning networks",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: [
        {
          name: "ipconfig",
          description: "Get the network configuration of the device",
          inputSchema: { type: "object", properties: {}, required: [] }
        },
        {
          name: "scan_live_hosts",
          description: "Scan for live hosts on a network",
          inputSchema: {
            type: "object",
            properties: {
              scanType: { type: "string", enum: ["-PE", "-PR", "-PS", "-PU"] },
              target: { type: "string" },
              ipRange: { type: "string" },
            },
            required: ["scanType", "target", "ipRange"]
          },
        },
        {
          name: "scan_ports",
          description: "Scan for open ports on a network",
          inputSchema: {
            type: "object",
            properties: {
              scanType: { type: "string", enum: ["-sT", "-sS", "-sU", "-sV"] },
              target: { type: "string" },
              portRange: { type: "string" },
              speed: { type: "string", enum: ["-T0", "-T1", "-T2", "-T3", "-T4", "-T5"]},
            },
            required: ["scanType", "target"]
          },
        }
      ]
    }
  }
);

server.tool("ipconfig", {}, async () => {
  const command = new Deno.Command("ipconfig", {
    stdout: "piped", // Ensures stdout can be captured
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout);
  
  return {
    content: [{ type: "text", text: output }]
  };
});

// listen for tool calls
server.tool("scan_live_hosts",
  {
    scanType: z.string().nonempty().enum(["-PE", "-PR", "-PS", "-PU"]).describe("The type of  live host discovery scan to perform, -PE for ping scan, -PR for ARP scan, -PS for TCP scan, -PU for UDP scan"),
    target: z.string().cidr().nonempty().describe("The target to scan for example 198.161.0.1"),
    ipRange: z.string().nonempty().describe("The range of IPs to scan for example 24 for a 24 subnet"),
  },
  async (request) => {
    const { scanType, target, ipRange } = request;
    const command = new Deno.Command("nmap", {
      args: [scanType, "-sn", `${target}/${ipRange}`],
      stdout: "piped",
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout); 

  return {
    content: [{ type: "text", text: output }]
  };
  } 
);

server.tool("scan_ports",
  {
    scanType: z.string().nonempty().enum(["-sT", "-sS", "-sU", "-sV"]).describe("The type of port scan to perform, -sT for TCP connect scan, -sS for SYN scan, -sU for UDP scan, -sV for version detection"),
    target: z.string().cidr().nonempty().describe("The target to scan for example 198.161.0.1"),
    portRange: z.string().optional().describe("The range of ports to scan for example for range -p1-1000, for specific ports -p80,443, for all ports -p-, keep empty for 1,000 most common por which is preferable"),
    speed: z.string().optional().enum(["-T0", "-T1", "-T2", "-T3", "-T4", "-T5"]).describe("The speed of the scan, -T0 for paranoid, -T1 for sneaky, -T2 for polite, -T3 for normal, -T4 for aggressive, -T5 for insane"),
  },
  async (request) => {
    const { scanType, target, portRange, speed } = request;
    const command = new Deno.Command("nmap", {
      args: [scanType, portRange, speed, target],
      stdout: "piped",
  });
  
  const { stdout } = await command.output(); 
  const output = new TextDecoder().decode(stdout); 
  return {
    content: [{ type: "text", text: output }]
  };
  }
);


// Start server
try{
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Secure MCP nmap Server running on stdio");
}
catch (error) {
  console.error("Failed to start server: ", error);
}

