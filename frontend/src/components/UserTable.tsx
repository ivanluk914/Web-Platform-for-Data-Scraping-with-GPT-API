import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Pagination,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { BsSearch, BsChevronDown } from "react-icons/bs";

// Enum to match Go backend
enum UserRole {
  User = 1,
  Member = 2,
  Admin = 3,
}

// Type guard to check if a number is a valid UserRole
const isValidUserRole = (role: number): role is UserRole => {
  return Object.values(UserRole).includes(role);
};

// Function to convert role number to string
const getRoleString = (role: number): string => {
  if (!isValidUserRole(role)) return "";
  
  switch (role) {
    case UserRole.User:
      return "User";
    case UserRole.Member:
      return "Member";
    case UserRole.Admin:
      return "Admin";
    default:
      return "";
  }
};

// Get appropriate color for role chip
const getRoleColor = (role: number): "primary" | "secondary" | "success" => {
  if (!isValidUserRole(role)) return "primary";
  
  switch (role) {
    case UserRole.User:
      return "primary";
    case UserRole.Member:
      return "secondary";
    case UserRole.Admin:
      return "success";
    default:
      return "primary";
  }
};

const columns = [
  { name: "NAME", uid: "name" },
  { name: "EMAIL", uid: "email" },
  { name: "NICKNAME", uid: "nickname" },
  { name: "LAST LOGIN", uid: "last_login" },
  { name: "ROLE", uid: "role" },
];

interface UserModel {
  user_id?: string;
  connection?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  username?: string;
  nickname?: string;
  screen_name?: string;
  location?: string;
  last_login?: string;
  picture?: string;
  roles?: number[];
}

interface UserTableProps {
  users: UserModel[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

const UserTable = ({
  users,
  isLoading,
  error,
  page,
  pageSize,
  setPage,
  setPageSize
}: UserTableProps) => {
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(columns.map(col => col.uid)));

  const filteredItems = useMemo(() => {
    return users.filter((user) =>
      (user.name?.toLowerCase() || "").includes(filterValue.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(filterValue.toLowerCase()) ||
      (user.nickname?.toLowerCase() || "").includes(filterValue.toLowerCase())
    );
  }, [users, filterValue]);

  const pages = Math.ceil(filteredItems.length / pageSize);

  const renderCell = useCallback((user: UserModel, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "lg", src: user.picture }}
            name={user.name || ""}
          >
            {user.email}
          </User>
        );
      case "last_login":
        return user.last_login ? (
          <Chip className="capitalize" size="sm" variant="flat">
            {new Date(user.last_login).toLocaleString()}
          </Chip>
        ) : (
          "Never"
        );
      case "role":
        if (!user.roles || user.roles.length === 0) return null;
        return (
          <div className="flex gap-2">
            {user.roles
              .filter(role => isValidUserRole(role))
              .sort((a, b) => b - a) // Sort roles in descending order (Admin appears first)
              .map((role, index) => (
                <Chip
                  key={`${user.user_id}-role-${index}`}
                  className="capitalize"
                  size="sm"
                  variant="flat"
                  color={getRoleColor(role)}
                >
                  {getRoleString(role)}
                </Chip>
              ))}
          </div>
        );
      default:
        return user[columnKey as keyof UserModel] || "N/A";
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name, email, or nickname..."
            startContent={<BsSearch />}
            value={filterValue}
            onClear={() => setFilterValue("")}
            onValueChange={setFilterValue}
          />
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<BsChevronDown className="text-small" />}
                variant="flat"
              >
                Columns
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={visibleColumns}
              selectionMode="multiple"
              onSelectionChange={setVisibleColumns}
            >
              {columns.map((column) => (
                <DropdownItem key={column.uid} className="capitalize">
                  {column.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    );
  }, [filterValue, visibleColumns]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={page === 1}
            size="sm"
            variant="flat"
            onPress={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            isDisabled={page === pages}
            size="sm"
            variant="flat"
            onPress={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [page, pages, setPage]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Table
      aria-label="User table"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[382px]",
      }}
      topContent={topContent}
      topContentPlacement="outside"
    >
      <TableHeader columns={columns.filter(col => visibleColumns.has(col.uid))}>
        {(column) => (
          <TableColumn key={column.uid}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={filteredItems.slice((page - 1) * pageSize, page * pageSize)}>
        {(user) => (
          <TableRow key={user.user_id}>
            {columns
              .filter(column => visibleColumns.has(column.uid))
              .map((column) => (
                <TableCell key={column.uid}>
                  {renderCell(user, column.uid)}
                </TableCell>
              ))}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default UserTable;