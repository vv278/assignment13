import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
};

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");

  // Fetch expenses from Supabase
  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*");

    if (error) {
      console.log("Error fetching data:", error);
    } else {
      setExpenses(data || []);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Add Expense
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

  // Delete Expense
    const deleteExpense = async (id: number) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) {
        console.log("Error deleting expense:", error);
      } else {
        fetchExpenses();
      }
    };

  return (
    <div className="container">
      <h2>Expense Tracker</h2>

      {/* FORM ROW */}
      <div className="formRow">

        {/* Title */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Amount */}
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Shopping">Shopping</option>
          <option value="Bills">Bills</option>
          <option value="Other">Other</option>
        </select>

        {/* Button */}
        <button onClick={addExpense}>
          Add Expense
        </button>
      </div>

      {/* EXPENSE LIST */}
      <ul>
        {expenses.map((exp) => (
          <li key={exp.id}>
            {exp.title} - ${exp.amount} ({exp.category})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;