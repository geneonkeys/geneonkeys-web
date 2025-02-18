import { ChangeEvent, useState } from "react"

const App = () => {
  type Entry = {
    startTime: number
    elapsedTime: number
    description: string
  }

  const [now, setNow] = useState(Date.now())
  const [suddenlyIWasAwake, setSuddenlyIWasAwake] = useState(false)
  const [entryList, setEntryList] = useState<Entry[]>([])
  const [startTime, setStartTime] = useState(0);
  const [description, setDescription] = useState("")

  const beginEntry = () => {
    setStartTime(Date.now())
    setDescription("")
  }

  const endEntry = () => {
    const elapsedTime = Date.now() - startTime
    const updatedEntries = [...entryList, {
      startTime,
      elapsedTime,
      description
    }]
    setEntryList(updatedEntries)
    beginEntry()
  }

  const awaken = () => {
    console.log('hello?')
    setSuddenlyIWasAwake(true)
    setInterval(() => {
      console.log('is this even working')
      setNow(Date.now())
    }, 100)
    beginEntry()
  }

  const handleChangeDescription = (changedDescriptionEvent: ChangeEvent<HTMLInputElement>) => {
    setDescription(changedDescriptionEvent.target.value)
  }

  return (
    <>
      {!suddenlyIWasAwake && <button onClick={awaken}>Suddenly, I was awake.</button>}
      <ul>
        {entryList.map((entry, i) => (
          <li key={i}>
            [{entry.elapsedTime}]: {entry.description}
          </li>
        ))}
        <li>
          [{(now - startTime)}]: <input value={description} onChange={handleChangeDescription} />
        </li>
      </ul>
      {suddenlyIWasAwake && <button onClick={endEntry}>Close entry</button>}
    </>
  )
}

export default App
