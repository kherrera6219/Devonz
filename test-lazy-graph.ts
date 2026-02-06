
// Wrapper to mock dependencies without complex injection frameworks
import { LazyGraphService } from './app/lib/services/lazyGraphService';

// Mock RAG Service
class MockRAGService {
  async query(projectId: string, query: string, topK: number = 5) {
    console.log(`[MockRAG] Querying for: "${query}"`);
    return [
      `File: app/components/Button.tsx\n---\nexport const Button = () => <button>Click me</button>;\n---`,
      `File: app/utils/helpers.ts\n---\nexport const formatDate = (d) => d.toString();\n---`
    ];
  }
}

// Mock Graph Service
class MockGraphService {
  async getProjectSubgraph(projectId: string, limit: number = 100) {
    console.log(`[MockGraph] Fetching subgraph for project: ${projectId}`);
    return []; // Return empty or mock nodes
  }
}

async function main() {
  console.log("--- Testing LazyGraphService ---");

  const mockRag = new MockRAGService();
  const mockGraph = new MockGraphService();

  // Cast to any to bypass private constructor strictness/types for this simple test script
  const lazyService = LazyGraphService.getInstance(mockRag as any, mockGraph as any);

  const context = await lazyService.query("test-project", "How do I make a button?");

  console.log("\n--- Result Context ---");
  console.log(context);

  if (context.includes("app/components/Button.tsx") && context.includes("[Graph Status]: Enriched context active.")) {
    console.log("\n✅ Verification Passed: Content retrieved and graph status appended.");
  } else {
    console.log("\n❌ Verification Failed");
    process.exit(1);
  }
}

main();
