import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  Selection,
  ChipProps,
  SortDescriptor,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  useDisclosure,
  ModalContent,
} from "@nextui-org/react";
import {
  BsThreeDotsVertical,
  BsPlusLg,
  BsChevronDown,
  BsSearch,
} from "react-icons/bs";

const columns = [
  { name: "ID", uid: "user_id", sortable: true },
  { name: "NAME", uid: "name", sortable: true },
  { name: "ROLE", uid: "role", sortable: true },
  { name: "CREATED_AT", uid: "created_at", sortable: true },
  { name: "LAST_LOGIN", uid: "last_login", sortable: true },
  { name: "EMAIL", uid: "email" },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "USER_ORIGIN", uid: "user_origin", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
  { name: "Active", uid: "active" },
  { name: "Disabled", uid: "disabled" },
];

const initialUsers = [
    {
        user_id: 1,
        name: "Tony Reichert",
        role: "Member",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        email: "tony.reichert@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 2,
        name: "Zoey Lang",
        role: "User",
        created_at: "09/10/2024",
        last_login: "10/10/2024",
        status: "disabled",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        email: "zoey.lang@example.com",
        user_origin: "sso"
    },
    {
        user_id: 3,
        name: "Jane Fisher",
        role: "User",
        created_at: "07/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
        email: "jane.fisher@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 4,
        name: "William Howard",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
        email: "william.howard@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 5,
        name: "Kristen Copper",
        role: "Admin",
        created_at: "01/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
        email: "kristen.cooper@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 6,
        name: "Brian Kim",
        role: "Admin",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        email: "brian.kim@example.com",
        status: "active",
        user_origin: "sso"
    },
    {
        user_id: 7,
        name: "Michael Hunt",
        role: "User",
        created_at: "10/09/2024",
        last_login: "10/10/2024",
        status: "disabled",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29027007d",
        email: "michael.hunt@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 8,
        name: "Samantha Brooks",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e27027008d",
        email: "samantha.brooks@example.com",
        user_origin: "sso"
    },
    {
        user_id: 9,
        name: "Frank Harrison",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=4",
        email: "frank.harrison@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 10,
        name: "Emma Adams",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=5",
        email: "emma.adams@example.com",
        user_origin: "sso"
    },
    {
        user_id: 11,
        name: "Brandon Stevens",
        role: "Member",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=8",
        email: "brandon.stevens@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 12,
        name: "Megan Richards",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "disabled",
        avatar: "https://i.pravatar.cc/150?img=10",
        email: "megan.richards@example.com",
        user_origin: "sso"
    },
    {
        user_id: 13,
        name: "Oliver Scott",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=12",
        email: "oliver.scott@example.com",
        user_origin: "sso"
    },
    {
        user_id: 14,
        name: "Grace Allen",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=16",
        email: "grace.allen@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 15,
        name: "Noah Carter",
        role: "Member",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "disabled",
        avatar: "https://i.pravatar.cc/150?img=15",
        email: "noah.carter@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 16,
        name: "Ava Perez",
        role: "Admin",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=20",
        email: "ava.perez@example.com",
        user_origin: "sso"
    },
    {
        user_id: 17,
        name: "Liam Johnson",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=33",
        email: "liam.johnson@example.com",
        user_origin: "acc/pw"
    },
    {
        user_id: 18,
        name: "Sophia Taylor",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=29",
        email: "sophia.taylor@example.com",
        user_origin: "sso"
    },
    {
        user_id: 19,
        name: "Lucas Harris",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "disabled",
        avatar: "https://i.pravatar.cc/150?img=50",
        email: "lucas.harris@example.com",
        user_origin: "sso"
    },
    {
        user_id: 20,
        name: "Mia Robinson",
        role: "User",
        created_at: "10/10/2024",
        last_login: "10/10/2024",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=45",
        email: "mia.robinson@example.com",
        user_origin: "acc/pw"
    },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  active: "success",
  disabled: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "user_id",
  "name",
  "role",
  "created_at",
  "last_login",
  "email",
  "status",
  "actions",
];

type UserType = typeof initialUsers[0];

const UserTable = () => {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "user_id",
    direction: "ascending",
  });

  const [page, setPage] = React.useState(1);

  const [userList, setUserList] = React.useState<UserType[]>(initialUsers);

  
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserType | null>(null);
  const [editedName, setEditedName] = React.useState("");
  const [editedRole, setEditedRole] = React.useState("");
  const [editedEmail, setEditedEmail] = React.useState("");

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...userList];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    if (
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status)
      );
    }

    return filteredUsers;
  }, [userList, filterValue, statusFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: UserType, b: UserType) => {
      const first = a[sortDescriptor.column as keyof UserType];
      const second = b[sortDescriptor.column as keyof UserType];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (user: UserType, columnKey: React.Key) => {
      const cellValue = user[columnKey as keyof UserType];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{ radius: "lg", src: user.avatar }}
              name={cellValue}
            ></User>
          );
        case "role":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">{cellValue}</p>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[user.status]}
              size="sm"
              variant="flat"
            >
              {cellValue}
            </Chip>
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
                <DropdownMenu
                  onAction={(key) => {
                    if (key === "edit") {
                      setSelectedUser(user);
                      setEditedName(user.name);
                      setEditedRole(user.role);
                      setEditedEmail(user.email);
                      onOpen();
                    } else if (key === "enable" || key === "disable") {
                      // Update user's status
                      setUserList((prevUserList) =>
                        prevUserList.map((u) =>
                          u.user_id === user.user_id
                            ? {
                                ...u,
                                status:
                                  key === "enable" ? "active" : "disabled",
                              }
                            : u
                        )
                      );
                    }
                  }}
                >
                    {/* @ts-ignore */}
                  {user.user_origin !== "sso" && (
                    <DropdownItem key="edit">Edit</DropdownItem>
                  )}
                  {/* @ts-ignore */}
                  {user.status === "active" ? (
                    <DropdownItem key="disable">Disable</DropdownItem>
                  ) : (
                    <DropdownItem key="enable">Enable</DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [setUserList]
  );

  const onNextPage = React.useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = React.useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by name..."
            startContent={<BsSearch />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<BsChevronDown className="text-small" />}
                  variant="flat"
                >
                  Status
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
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
            <Button color="primary" endContent={<BsPlusLg />}>
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {userList.length} users
          </span>
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
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    userList.length,
    hasSearchFilter,
  ]);

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
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages]);

  const handleUpdateUser = () => {
    if (selectedUser) {
      setUserList((prevUserList) =>
        prevUserList.map((u) =>
          u.user_id === selectedUser.user_id
            ? { ...u, name: editedName, role: editedRole, email: editedEmail }
            : u
        )
      );
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    onClose();
    setSelectedUser(null);
    setEditedName("");
    setEditedRole("");
    setEditedEmail("");
  };

  return (
    <>
      <Table
        aria-label="Example table with custom cells, pagination and sorting"
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
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
          {(onClose) => (
            <>
        <ModalHeader>
          <h2>Edit User</h2>
        </ModalHeader>
        <ModalBody>
          <Input
            label="Name"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
          <Select
            label="Role"
            placeholder="Select Role"
            value={editedRole}
            onChange={(e) => setEditedRole(e.target.value)}
          >
            <SelectItem key="User" value="User">
              User
            </SelectItem>
            <SelectItem key="Member" value="Member">
              Member
            </SelectItem>
            <SelectItem key="Admin" value="Admin">
              Admin
            </SelectItem>
          </Select>
          <Input
            label="Email"
            value={editedEmail}
            onChange={(e) => setEditedEmail(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={handleUpdateUser}>Update</Button>
        </ModalFooter>
        </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserTable;
