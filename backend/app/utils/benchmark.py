import time
import asyncio
import json
import statistics
import os
from typing import List, Dict
from app.services.gemini_service import gemini_service
from app.services.chroma_service import chroma_service

class RAGBenchmarker:
    def __init__(self, test_document_path: str = None):
        self.test_document_path = test_document_path
        self.queries = [
            {"query": "What is the primary authority for Atlas Tutor?", "expected": "Academic Syllabus / Archive materials"},
            {"query": "How does Atlas handle out-of-syllabus topics?", "expected": "Clearly state not covered, do not answer from general knowledge"},
            {"query": "What is the capital of France?", "expected": "Refusal (not in syllabus)"}
        ]

    async def benchmark_latency(self, iterations: int = 3) -> Dict:
        latencies = {
            "embedding": [],
            "retrieval": [],
            "first_token": [],
            "total_generation": [],
            "e2e": []
        }

        print(f"🚀 Starting latency benchmark ({iterations} iterations)...")

        for i in range(iterations):
            for q_data in self.queries:
                query = q_data["query"]
                
                start_time = time.perf_counter()
                
                # 1. Embedding
                embed_start = time.perf_counter()
                query_embedding = gemini_service.get_query_embedding(query)
                latencies["embedding"].append(time.perf_counter() - embed_start)
                
                # 2. Retrieval
                retrieve_start = time.perf_counter()
                relevant_chunks, _ = chroma_service.query_docs(query_embedding)
                latencies["retrieval"].append(time.perf_counter() - retrieve_start)
                
                if not relevant_chunks:
                    # Case for refusal (latency is different)
                    latencies["e2e"].append(time.perf_counter() - start_time)
                    continue

                # 3. Generation
                context = "\n\n".join(relevant_chunks)
                prompt = f"Context: {context}\n\nQuestion: {query}"
                
                gen_start = time.perf_counter()
                first_token_received = False
                
                full_response = ""
                async for chunk in gemini_service.generate_response_stream(prompt):
                    if not first_token_received:
                        latencies["first_token"].append(time.perf_counter() - gen_start)
                        first_token_received = True
                    full_response += chunk
                
                latencies["total_generation"].append(time.perf_counter() - gen_start)
                latencies["e2e"].append(time.perf_counter() - start_time)

        return {
            k: {
                "avg": statistics.mean(v) if v else 0,
                "p95": sorted(v)[int(len(v) * 0.95)] if v else 0,
                "min": min(v) if v else 0,
                "max": max(v) if v else 0
            } for k, v in latencies.items()
        }

    async def evaluate_metrics(self) -> Dict:
        """
        Uses Gemini to evaluate Faithfulness and Relevance.
        """
        print("🧪 Evaluating RAG metrics (Faithfulness, Relevance, Refusal)...")
        results = []
        
        for q_data in self.queries:
            query = q_data["query"]
            query_embedding = gemini_service.get_query_embedding(query)
            relevant_chunks, _ = chroma_service.query_docs(query_embedding)
            
            context = "\n\n".join(relevant_chunks) if relevant_chunks else "NO CONTEXT PROVIDED"
            
            # Generate answer
            prompt = f"Context: {context}\n\nQuestion: {query}\nAnswer strictly based on context."
            response = await gemini_service.generate_response(prompt)
            
            # Judge Faithfulness
            faith_prompt = f"""
            Task: Evaluate if the Answer is faithful to the Context.
            Context: {context}
            Question: {query}
            Answer: {response}
            
            Return a JSON object: {{"faithfulness": 1 if grounded else 0, "reasoning": "..."}}
            """
            faith_judge = await gemini_service.generate_response(faith_prompt)
            
            # Judge Relevance
            rel_prompt = f"""
            Task: Evaluate if the Answer is relevant to the Question.
            Question: {query}
            Answer: {response}
            
            Return a JSON object: {{"relevance": 1 if relevant else 0, "reasoning": "..."}}
            """
            rel_judge = await gemini_service.generate_response(rel_prompt)
            
            try:
                # Clean up JSON if needed (Gemini sometimes adds markdown blocks)
                faith_json = json.loads(faith_judge.replace("```json", "").replace("```", "").strip())
                rel_json = json.loads(rel_judge.replace("```json", "").replace("```", "").strip())
                results.append({
                    "query": query,
                    "faithfulness": faith_json["faithfulness"],
                    "relevance": rel_json["relevance"]
                })
            except:
                print(f"Error parsing judge response for: {query}")

        return {
            "avg_faithfulness": statistics.mean([r["faithfulness"] for r in results]),
            "avg_relevance": statistics.mean([r["relevance"] for r in results]),
            "refusal_success": all(r["relevance"] == 1 for r in results) # Simplified
        }

if __name__ == "__main__":
    # This is for manual testing
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    
    async def run():
        benchmarker = RAGBenchmarker()
        latencies = await benchmarker.benchmark_latency(iterations=2)
        print(json.dumps(latencies, indent=2))
        
        metrics = await benchmarker.evaluate_metrics()
        print(json.dumps(metrics, indent=2))

    asyncio.run(run())
