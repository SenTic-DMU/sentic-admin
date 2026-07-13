import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
];

describe("DataTable", () => {
  it("renders a row for each item", () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { id: "1", name: "Alice" },
          { id: "2", name: "Bob" },
        ]}
        rowKey={(row) => row.id}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders the empty message when there is no data", () => {
    render(<DataTable columns={columns} data={[]} rowKey={(row) => row.id} />);
    expect(screen.getByText("데이터가 없습니다.")).toBeInTheDocument();
  });
});
