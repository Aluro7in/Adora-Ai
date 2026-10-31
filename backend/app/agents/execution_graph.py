"""
Adora AI — Agent Execution Graph (DAG)
Validates dependency graphs, checks for cyclic dependencies, and computes topological sort.
"""

from typing import List, Dict, Any, Set


class CyclicDependencyError(Exception):
    """Raised when an execution DAG contains cycles."""
    pass


class InvalidDependencyError(Exception):
    """Raised when a task depends on an unknown task ID."""
    pass


class ExecutionGraph:
    @staticmethod
    def validate_and_sort(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validates the DAG structure and returns tasks in topological execution order.
        """
        task_map = {t["id"]: t for t in tasks}
        in_degree: Dict[str, int] = {t["id"]: 0 for t in tasks}
        adj_list: Dict[str, List[str]] = {t["id"]: [] for t in tasks}

        # Build graph
        for t in tasks:
            tid = t["id"]
            deps = t.get("dependencies", [])
            for dep in deps:
                if dep not in task_map:
                    raise InvalidDependencyError(f"Task '{tid}' depends on non-existent task '{dep}'.")
                adj_list[dep].append(tid)
                in_degree[tid] += 1

        # Kahn's algorithm for topological sorting
        queue = [tid for tid, deg in in_degree.items() if deg == 0]
        sorted_ids: List[str] = []

        while queue:
            curr = queue.pop(0)
            sorted_ids.append(curr)

            for neighbor in adj_list[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(sorted_ids) != len(tasks):
            raise CyclicDependencyError("Execution graph contains cyclic dependencies and cannot execute.")

        return [task_map[tid] for tid in sorted_ids]
