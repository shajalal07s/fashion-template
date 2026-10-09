export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  status: "active" | "inactive";
}

export type JournalStatus = "posted" | "draft";

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  description: string;
  lines: JournalLine[];
  status: JournalStatus;
}

export type ExpenseStatus = "paid" | "pending" | "approved";

export interface Expense {
  id: string;
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  method: string;
  status: ExpenseStatus;
}

export interface BankAccount {
  id: string;
  name: string;
  kind: "bank" | "cash" | "mobile";
  accountNo: string;
  balance: number;
  status: "active" | "inactive";
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  appliedTo: string;
  status: "active" | "inactive";
}

export type AccInvoiceStatus = "paid" | "unpaid" | "partial" | "overdue";

export interface AccInvoice {
  id: string;
  customer: string;
  date: string;
  due: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  status: AccInvoiceStatus;
}

export const demoAccounts: Account[] = [
  { id: "a1", code: "1001", name: "Cash in Hand", type: "asset", balance: 245000, status: "active" },
  { id: "a2", code: "1010", name: "DBBL Current A/C", type: "asset", balance: 1250000, status: "active" },
  { id: "a3", code: "1020", name: "bKash Merchant", type: "asset", balance: 386500, status: "active" },
  { id: "a4", code: "1030", name: "Nagad Merchant", type: "asset", balance: 142800, status: "active" },
  { id: "a5", code: "1100", name: "Accounts Receivable", type: "asset", balance: 218400, status: "active" },
  { id: "a6", code: "1200", name: "Inventory", type: "asset", balance: 1840000, status: "active" },
  { id: "a7", code: "2001", name: "Accounts Payable", type: "liability", balance: 312600, status: "active" },
  { id: "a8", code: "2100", name: "VAT Payable", type: "liability", balance: 96400, status: "active" },
  { id: "a9", code: "3001", name: "Owner Equity", type: "equity", balance: 2500000, status: "active" },
  { id: "a10", code: "4001", name: "Sales Revenue", type: "income", balance: 3420000, status: "active" },
  { id: "a11", code: "4020", name: "Delivery Income", type: "income", balance: 186000, status: "active" },
  { id: "a12", code: "5001", name: "Shop Rent", type: "expense", balance: 360000, status: "active" },
  { id: "a13", code: "5010", name: "Salaries", type: "expense", balance: 720000, status: "active" },
  { id: "a14", code: "5020", name: "Marketing", type: "expense", balance: 245000, status: "active" },
  { id: "a15", code: "5030", name: "Utilities", type: "expense", balance: 68400, status: "active" },
  { id: "a16", code: "5040", name: "Delivery Cost", type: "expense", balance: 158000, status: "inactive" },
];

export const demoJournal: JournalEntry[] = [
  {
    id: "j1",
    date: "2026-09-20",
    ref: "JE-0101",
    description: "Eid campaign sales received via bKash",
    lines: [
      { accountId: "a3", debit: 186000, credit: 0 },
      { accountId: "a10", debit: 0, credit: 186000 },
    ],
    status: "posted",
  },
  {
    id: "j2",
    date: "2026-09-18",
    ref: "JE-0100",
    description: "September shop rent paid",
    lines: [
      { accountId: "a12", debit: 45000, credit: 0 },
      { accountId: "a1", debit: 0, credit: 45000 },
    ],
    status: "posted",
  },
  {
    id: "j3",
    date: "2026-09-15",
    ref: "JE-0099",
    description: "Staff salaries for August",
    lines: [
      { accountId: "a13", debit: 90000, credit: 0 },
      { accountId: "a2", debit: 0, credit: 90000 },
    ],
    status: "posted",
  },
  {
    id: "j4",
    date: "2026-09-12",
    ref: "JE-0098",
    description: "Fabric purchase from supplier on credit",
    lines: [
      { accountId: "a6", debit: 240000, credit: 0 },
      { accountId: "a7", debit: 0, credit: 240000 },
    ],
    status: "posted",
  },
  {
    id: "j5",
    date: "2026-09-10",
    ref: "JE-0097",
    description: "Facebook ads boost for Puja collection",
    lines: [
      { accountId: "a14", debit: 35000, credit: 0 },
      { accountId: "a3", debit: 0, credit: 35000 },
    ],
    status: "posted",
  },
  {
    id: "j6",
    date: "2026-09-08",
    ref: "JE-0096",
    description: "Wholesale order #1042 received in bank",
    lines: [
      { accountId: "a2", debit: 320000, credit: 0 },
      { accountId: "a10", debit: 0, credit: 320000 },
    ],
    status: "posted",
  },
  {
    id: "j7",
    date: "2026-09-05",
    ref: "JE-0095",
    description: "Electricity + internet bills",
    lines: [
      { accountId: "a15", debit: 8600, credit: 0 },
      { accountId: "a1", debit: 0, credit: 8600 },
    ],
    status: "draft",
  },
  {
    id: "j8",
    date: "2026-09-02",
    ref: "JE-0094",
    description: "Owner capital introduced",
    lines: [
      { accountId: "a2", debit: 500000, credit: 0 },
      { accountId: "a9", debit: 0, credit: 500000 },
    ],
    status: "posted",
  },
];

export const demoExpenses: Expense[] = [
  { id: "e1", date: "2026-09-18", category: "Rent", vendor: "Gulshan Holdings", description: "September shop rent", amount: 45000, method: "Cash", status: "paid" },
  { id: "e2", date: "2026-09-15", category: "Salary", vendor: "Payroll", description: "August staff salaries (6 staff)", amount: 90000, method: "Bank", status: "paid" },
  { id: "e3", date: "2026-09-10", category: "Marketing", vendor: "Meta Ads", description: "Puja collection boost", amount: 35000, method: "bKash", status: "paid" },
  { id: "e4", date: "2026-09-08", category: "Delivery", vendor: "Steadfast", description: "Weekly courier settlement", amount: 12400, method: "Bank", status: "paid" },
  { id: "e5", date: "2026-09-05", category: "Utilities", vendor: "DESCO", description: "Electricity + internet", amount: 8600, method: "Cash", status: "pending" },
  { id: "e6", date: "2026-09-03", category: "Packaging", vendor: "Karwan Suppliers", description: "Shopping bags & boxes", amount: 15800, method: "Nagad", status: "approved" },
  { id: "e7", date: "2026-09-01", category: "Maintenance", vendor: "FixIt BD", description: "AC servicing showroom", amount: 6500, method: "Cash", status: "approved" },
  { id: "e8", date: "2026-08-28", category: "Marketing", vendor: "Influencer - Nusrat", description: "Eid reels promotion", amount: 25000, method: "bKash", status: "paid" },
];

export const demoBanks: BankAccount[] = [
  { id: "b1", name: "Cash in Hand", kind: "cash", accountNo: "—", balance: 245000, status: "active" },
  { id: "b2", name: "DBBL Current", kind: "bank", accountNo: "•••• 4521", balance: 1250000, status: "active" },
  { id: "b3", name: "bKash Merchant", kind: "mobile", accountNo: "01••• 334455", balance: 386500, status: "active" },
  { id: "b4", name: "Nagad Merchant", kind: "mobile", accountNo: "01••• 778899", balance: 142800, status: "inactive" },
];

export const demoTaxes: TaxRate[] = [
  { id: "t1", name: "VAT", rate: 15, appliedTo: "All taxable sales", status: "active" },
  { id: "t2", name: "AIT", rate: 5, appliedTo: "Wholesale orders", status: "active" },
  { id: "t3", name: "Zero Rated", rate: 0, appliedTo: "Export sales", status: "inactive" },
];

export const demoAccInvoices: AccInvoice[] = [
  { id: "INV-2041", customer: "Ayesha Rahman", date: "2026-09-20", due: "2026-09-27", items: 3, subtotal: 8450, tax: 1268, total: 9718, paidAmount: 9718, status: "paid" },
  { id: "INV-2040", customer: "Karim Traders", date: "2026-09-18", due: "2026-10-02", items: 12, subtotal: 96000, tax: 14400, total: 110400, paidAmount: 55000, status: "partial" },
  { id: "INV-2039", customer: "Nusrat Jahan", date: "2026-09-15", due: "2026-09-22", items: 2, subtotal: 5200, tax: 780, total: 5980, paidAmount: 0, status: "unpaid" },
  { id: "INV-2038", customer: "Dhaka Boutique", date: "2026-08-30", due: "2026-09-06", items: 20, subtotal: 145000, tax: 21750, total: 166750, paidAmount: 0, status: "overdue" },
  { id: "INV-2037", customer: "Tanvir Hasan", date: "2026-09-12", due: "2026-09-19", items: 1, subtotal: 3490, tax: 524, total: 4014, paidAmount: 4014, status: "paid" },
];

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salary",
  "Marketing",
  "Utilities",
  "Delivery",
  "Packaging",
  "Maintenance",
  "Other",
];

export function journalTotals(entry: JournalEntry): { debit: number; credit: number } {
  return entry.lines.reduce(
    (sum, l) => ({ debit: sum.debit + l.debit, credit: sum.credit + l.credit }),
    { debit: 0, credit: 0 }
  );
}

export function isBalanced(entry: JournalEntry): boolean {
  const { debit, credit } = journalTotals(entry);
  return debit > 0 && debit === credit;
}

export interface AccountingSummary {
  income: number;
  expenses: number;
  profit: number;
  cash: number;
  receivable: number;
  payable: number;
}

export function accountingSummary(
  accounts: Account[],
  expenses: Expense[]
): AccountingSummary {
  const byType = (type: AccountType) =>
    accounts.filter((a) => a.type === type && a.status === "active").reduce((n, a) => n + a.balance, 0);
  const paidExpenses = expenses
    .filter((e) => e.status === "paid")
    .reduce((n, e) => n + e.amount, 0);
  const income = byType("income");
  const accountExpenses = byType("expense");
  const expensesTotal = accountExpenses + paidExpenses;
  return {
    income,
    expenses: expensesTotal,
    profit: income - expensesTotal,
    cash: accounts
      .filter((a) => ["1001", "1010", "1020", "1030"].includes(a.code))
      .reduce((n, a) => n + a.balance, 0),
    receivable: accounts.find((a) => a.code === "1100")?.balance ?? 0,
    payable: byType("liability"),
  };
}

export interface CashflowPoint {
  month: string;
  income: number;
  expense: number;
  [key: string]: string | number;
}

export function monthlyCashflow(): CashflowPoint[] {
  return [
    { month: "Apr", income: 420000, expense: 310000 },
    { month: "May", income: 510000, expense: 335000 },
    { month: "Jun", income: 480000, expense: 360000 },
    { month: "Jul", income: 620000, expense: 390000 },
    { month: "Aug", income: 590000, expense: 410000 },
    { month: "Sep", income: 506000, expense: 238300 },
  ];
}

export function expenseByCategory(expenses: Expense[]): Array<{ id: string; label: string; value: number }> {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()].map(([label, value]) => ({ id: label, label, value }));
}
