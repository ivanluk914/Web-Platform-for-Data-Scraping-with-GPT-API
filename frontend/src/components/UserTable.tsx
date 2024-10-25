import React from "react";
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
  Selection,
  SortDescriptor,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  useDisclosure,
} from "@nextui-org/react";
import { BsSearch, BsThreeDotsVertical, BsChevronDown, BsDownload } from "react-icons/bs";
import { UserModel } from "../models/user";

enum UserRole {
  User = 1,
  Member = 2,
  Admin = 3,
}

const roleOptions = [
  { uid: "1", name: "User" },
  { uid: "2", name: "Member" },
  { uid: "3", name: "Admin" },
];

const columns = [
  { name: "NAME", uid: "name", sortable: true },
  { name: "EMAIL", uid: "email", sortable: true },
  { name: "NICKNAME", uid: "nickname", sortable: true },
  { name: "LAST LOGIN", uid: "last_login", sortable: true },
  { name: "ROLE", uid: "role", sortable: false },
  { name: "ACTIONS", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = ["name", "email", "nickname", "last_login", "role", "actions"];

interface UserTableProps {
  users: UserModel[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateRoles: (userId: string, rolesToAdd: number[], rolesToRemove: number[]) => void;
  isDeleting: boolean;
  isUpdatingRoles: boolean;
}

const UserTable = ({
  users,
  isLoading,
  error,
  page,
  pageSize,
  setPage,
  setPageSize,
  onDeleteUser,
  onUpdateRoles,
  isDeleting,
  isUpdatingRoles,
}: UserTableProps) => {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [roleFilter, setRoleFilter] = React.useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name?.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.email?.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (roleFilter !== "all" && Array.from(roleFilter).length !== roleOptions.length) {
      filteredUsers = filteredUsers.filter((user) =>
        user.roles?.some(role => Array.from(roleFilter).includes(role.toString()))
      );
    }

    return filteredUsers;
  }, [users, filterValue, roleFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: UserModel, b: UserModel) => {
      const first = a[sortDescriptor.column as keyof UserModel];
      const second = b[sortDescriptor.column as keyof UserModel];
      const cmp = first && second ? first < second ? -1 : first > second ? 1 : 0 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isRoleOpen, onOpen: onRoleOpen, onClose: onRoleClose } = useDisclosure();
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [selectedUserRoles, setSelectedUserRoles] = React.useState<number[]>([]);
  const [originalUserRoles, setOriginalUserRoles] = React.useState<number[]>([]);

  const handleConfirmDelete = async () => {
    onDeleteUser(selectedUserId);
    onDeleteClose();
  };

  const handleRoleUpdate = async () => {
    const rolesToAdd = selectedUserRoles.filter(role => !originalUserRoles.includes(role));
    const rolesToRemove = originalUserRoles.filter(role => !selectedUserRoles.includes(role));
    
    await onUpdateRoles(selectedUserId, rolesToAdd, rolesToRemove);
    onRoleClose();
  };

  const handleDeleteClick = (userId: string) => {
    setSelectedUserId(userId);
    onDeleteOpen();
  };

  const handleRoleClick = (userId: string, currentRoles: number[]) => {
    setSelectedUserId(userId);
    setSelectedUserRoles(currentRoles);
    setOriginalUserRoles(currentRoles);
    onRoleOpen();
  };

  const handleDownload = async () => {
    try {
      const headers = ['Name', 'Email', 'Nickname', 'Last Login', 'Roles'];
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          `"${user.name || ''}"`,  // Wrap in quotes to handle commas in names
          `"${user.email || ''}"`,
          `"${user.nickname || ''}"`,
          `"${user.last_login || ''}"`,
          `"${user.roles?.map(role => UserRole[role]).join(';') || ''}"`,
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading users:', error);
      // Handle error (show toast notification, etc.)
    }
  };
  
  const renderCell = React.useCallback((user: UserModel, columnKey: React.Key) => {
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
              .filter(role => Object.values(UserRole).includes(role))
              .sort((a, b) => b - a)
              .map((role, index) => (
                <Chip
                  key={`${user.user_id}-role-${index}`}
                  className="capitalize"
                  size="sm"
                  variant="flat"
                  color={role === UserRole.Admin ? "success" : role === UserRole.Member ? "secondary" : "primary"}
                >
                  {UserRole[role]}
                </Chip>
              ))}
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <BsThreeDotsVertical className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem 
                  color="danger" 
                  onPress={() => handleDeleteClick(user.user_id || "")}
                >
                  Delete User
                </DropdownItem>
                <DropdownItem
                  onPress={() => handleRoleClick(user.user_id || "", user.roles || [])}
                >
                  Assign Role
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return user[columnKey as keyof UserModel] || "N/A";
    }
  }, [handleDeleteClick, handleRoleClick]);

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
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
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<BsChevronDown className="text-small" />} variant="flat">
                  Roles
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Filter Roles"
                closeOnSelect={false}
                selectedKeys={roleFilter}
                selectionMode="multiple"
                onSelectionChange={setRoleFilter}
              >
                {roleOptions.map((role) => (
                  <DropdownItem key={role.uid} className="capitalize">
                    {role.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<BsChevronDown className="text-small" />} variant="flat">
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
            <Button 
              color="primary" 
              endContent={<BsDownload />}
              onPress={handleDownload}
            >
              Download
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {users.length} users</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [filterValue, roleFilter, visibleColumns, users.length]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
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
          <Button isDisabled={page === 1} size="sm" variant="flat" onPress={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button isDisabled={page === pages} size="sm" variant="flat" onPress={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
    <Table
      aria-label="User table with custom cells, pagination and sorting"
      isHeaderSticky
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[382px]",
      }}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={setSelectedKeys}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No users found"} items={sortedItems}>
        {(item) => (
          <TableRow key={item.user_id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this user? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDeleteClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal isOpen={isRoleOpen} onClose={onRoleClose}>
        <ModalContent>
          <ModalHeader>Assign Roles</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-3">
              {roleOptions.map((role) => (
                <Checkbox
                  key={role.uid}
                  isSelected={selectedUserRoles.includes(Number(role.uid))}
                  onValueChange={(isSelected) => {
                    setSelectedUserRoles(prev => 
                      isSelected 
                        ? [...prev, Number(role.uid)]
                        : prev.filter(r => r !== Number(role.uid))
                    );
                  }}
                >
                  {role.name}
                </Checkbox>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onRoleClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleRoleUpdate}
              isLoading={isUpdatingRoles}
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserTable;