import { useState } from 'react'

const fmt = (n) => '₹' + Math.abs(n).toFixed(2).replace(/\.00$/, '')

export default function App() {
  const [people, setPeople] = useState([])
  const [name, setName] = useState('')
  const [expenses, setExpenses] = useState([])
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [sharedBy, setSharedBy] = useState([]) // stretch: who shares the expense

  const addPerson = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n || people.length >= 6) return
    if (people.some((p) => p.toLowerCase() === n.toLowerCase())) return
    setPeople([...people, n])
    setSharedBy([...sharedBy, n])
    if (!paidBy) setPaidBy(n)
    setName('')
  }

  const removePerson = (p) => {
    if (expenses.some((x) => x.paidBy === p || x.sharedBy.includes(p))) {
      alert(`Delete ${p}'s expenses first.`)
      return
    }
    const rest = people.filter((x) => x !== p)
    setPeople(rest)
    setSharedBy(sharedBy.filter((x) => x !== p))
    if (paidBy === p) setPaidBy(rest[0] || '')
  }

  const toggleShare = (p) =>
    setSharedBy(sharedBy.includes(p) ? sharedBy.filter((x) => x !== p) : [...sharedBy, p])

  const addExpense = (e) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!desc.trim() || !(amt > 0) || !paidBy || sharedBy.length === 0) return
    setExpenses([...expenses, { id: Date.now(), description: desc.trim(), amount: amt, paidBy, sharedBy }])
    setDesc('')
    setAmount('')
  }

  const deleteExpense = (id) => setExpenses(expenses.filter((x) => x.id !== id))

  // Everything below is derived from the expenses array
  const total = expenses.reduce((s, x) => s + x.amount, 0)
  const equalShare = people.length ? total / people.length : 0
  const balances = people.map((p) => {
    const paid = expenses.filter((x) => x.paidBy === p).reduce((s, x) => s + x.amount, 0)
    const owes = expenses.filter((x) => x.sharedBy.includes(p)).reduce((s, x) => s + x.amount / x.sharedBy.length, 0)
    return { person: p, paid, share: owes, net: paid - owes }
  })
  const allEqual = expenses.every((x) => x.sharedBy.length === people.length)

  return (
    <main className="wrap">
      <header>
        <h1>SplitEasy</h1>
        <p>Add your group, log what everyone spends, see who owes whom.</p>
      </header>

      <section className="card">
        <h2>1. Group ({people.length}/6)</h2>
        <form className="row" onSubmit={addPerson}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Aman" maxLength={20} disabled={people.length >= 6} />
          <button disabled={people.length >= 6}>Add person</button>
        </form>
        <div className="chips">
          {people.map((p) => (
            <span className="chip" key={p}>
              {p}
              <button type="button" aria-label={`Remove ${p}`} onClick={() => removePerson(p)}>×</button>
            </span>
          ))}
        </div>
        {people.length < 2 && <p className="hint">Add at least 2 people to start (max 6).</p>}
      </section>

      {people.length >= 2 && (
        <>
          <section className="card">
            <h2>2. Add expense</h2>
            <form className="stack" onSubmit={addExpense}>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description, e.g. Dinner" />
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₹)" />
              <label>
                Paid by
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                  {people.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <fieldset>
                <legend>Shared by</legend>
                {people.map((p) => (
                  <label key={p} className="check">
                    <input type="checkbox" checked={sharedBy.includes(p)} onChange={() => toggleShare(p)} /> {p}
                  </label>
                ))}
              </fieldset>
              <button>Add expense</button>
            </form>
          </section>

          <section className="card">
            <h2>3. Expenses</h2>
            {expenses.length === 0 ? (
              <p className="hint">No expenses yet. Add one above.</p>
            ) : (
              <ul className="list">
                {expenses.map((x) => (
                  <li key={x.id}>
                    <div>
                      <strong>{x.description}</strong>
                      <small>
                        {x.paidBy} paid · split {x.sharedBy.length === people.length ? 'equally' : 'between ' + x.sharedBy.join(', ')}
                      </small>
                    </div>
                    <span className="amt">{fmt(x.amount)}</span>
                    <button className="del" onClick={() => deleteExpense(x.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>4. Totals</h2>
            <div className="totals">
              <div><small>Total spent</small><b>{fmt(total)}</b></div>
              {allEqual && <div><small>Equal share per person</small><b>{fmt(equalShare)}</b></div>}
            </div>
            {!allEqual && <p className="hint">Some expenses are split between selected people, so each person's share is shown below.</p>}
          </section>

          <section className="card">
            <h2>5. Balances</h2>
            <ul className="list">
              {balances.map((b) => {
                const net = Math.round(b.net * 100) / 100
                return (
                  <li key={b.person}>
                    <div>
                      <strong>{b.person}</strong>
                      <small>Paid {fmt(b.paid)} · share {fmt(b.share)}</small>
                    </div>
                    <span className={'amt ' + (net > 0 ? 'pos' : net < 0 ? 'neg' : '')}>
                      {net > 0 ? `is owed ${fmt(net)}` : net < 0 ? `owes ${fmt(net)}` : 'settled up'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
