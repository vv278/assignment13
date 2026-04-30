import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

import { Pie, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("expenses").select("*");

    if (error) {
      console.log("Error fetching data:", error);
    } else {
      setExpenses(data || []);
    }
  };

  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addExpense = async () => {
    if (!title || !amount) return;

    const { error } = await supabase.from("expenses").insert([
      {
        title,
        amount: Number(amount),
        category,
      },
    ]);

    if (error) {
      console.log("Error adding expense:", error);
    } else {
      setTitle("");
      setAmount("");
      setCategory("Food");
      fetchExpenses();
    }
  };

  const deleteExpense = async (id: number) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.log("Error deleting expense:", error);
    } else {
      fetchExpenses();
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  const filteredExpenses = expenses.filter((exp) =>
    exp.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryTotals: Record<string, number> = {};

  expenses.forEach((exp) => {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });

  const pieChartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Spending by Category",
        data: Object.values(categoryTotals),
      },
    ],
  };

  const monthlyTotals: Record<string, number> = {};

  expenses.forEach((exp) => {
    const date = new Date(exp.created_at);

    const monthYear = date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });

    monthlyTotals[monthYear] =
      (monthlyTotals[monthYear] || 0) + Number(exp.amount);
  });

  const lineChartData = {
    labels: Object.keys(monthlyTotals),
    datasets: [
      {
        label: "Monthly Spending",
        data: Object.values(monthlyTotals),
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="container">
      <h2>Expense Tracker</h2>

      <div className="formRow">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Shopping">Shopping</option>
          <option value="Bills">Bills</option>
          <option value="Other">Other</option>
        </select>

        <button onClick={addExpense}>Add Expense</button>
      </div>

      <h3>Total Expenses: ${totalExpenses.toFixed(2)}</h3>

      <input
        className="searchBox"
        type="text"
        placeholder="Search expenses by title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="charts">
        <div className="chartBox">
          <h3>Category-wise Summary</h3>
          <Pie data={pieChartData} />
        </div>

        <div className="chartBox">
          <h3>Monthly Spending</h3>
          <Line data={lineChartData} />
        </div>
      </div>

      <ul>
        {filteredExpenses.map((exp) => (
          <li key={exp.id}>
            {exp.title} - ${Number(exp.amount).toFixed(2)} ({exp.category})

            <button onClick={() => deleteExpense(exp.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;