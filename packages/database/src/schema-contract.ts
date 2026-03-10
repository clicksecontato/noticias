import { getSchemaPolicies } from "./schema-policy";

export interface TableDefinition {
  table: string;
  requiredColumns: string[];
  requiredIndexes: string[];
  requiredConstraints: string[];
}

export function getCoreTableDefinitions(): TableDefinition[] {
  return getSchemaPolicies().map((policy) => ({
    table: policy.table,
    requiredColumns: policy.requiredColumns,
    requiredIndexes: policy.requiredIndexes,
    requiredConstraints: policy.requiredConstraints
  }));
}
