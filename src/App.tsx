import { ChangeEvent, useEffect, useState } from "react"

enum LocalStorageKeys {
  ENTRY_LIST = "ENTRY_LIST"
}

const App = () => {
  type Entry = {
    startTime: number
    elapsedTime: number
    description: string
  }

  const [isRequestDeleteConfirm, setIsRequestDeleteConfirm] = useState(false)
  const [isRequestDelete, setIsRequestDelete] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [suddenlyIWasAwake, setSuddenlyIWasAwake] = useState(false)
  const [entryList, setEntryList] = useState<Entry[]>([])
  const [startTime, setStartTime] = useState(0);
  const [description, setDescription] = useState("")

  function saveLocalStorageEntryList() {
    try {
      localStorage.setItem(LocalStorageKeys.ENTRY_LIST, JSON.stringify(entryList))
    } catch (e) {
      console.log("Unable to save entry list to local storage.")
      console.log(e)
      localStorage.setItem(LocalStorageKeys.ENTRY_LIST, JSON.stringify([]))
    }
  }

  function loadLocalStorageEntryList() {
    try {
      const localStorageEntryListString = localStorage.getItem(LocalStorageKeys.ENTRY_LIST)
      const localStorageEntryExists = !!localStorageEntryListString;
      const localStorageEntryListObject = localStorageEntryExists ? JSON.parse(localStorageEntryListString) : null
      if (Array.isArray(localStorageEntryListObject)) {
        setEntryList(localStorageEntryListObject)
        return;
      }
      else {
        setEntryList([])
        saveLocalStorageEntryList()
      }
    } catch (e) {
      console.log("Unable to load entry list from local storage.")
      console.log(e)
      setEntryList([])
    }
  }

  function removeLocalStorageEntryList() {
    localStorage.removeItem(LocalStorageKeys.ENTRY_LIST)
    setIsRequestDelete(true)
    setIsRequestDeleteConfirm(false)
  }

  function confirmRequestDelete() {
    window.location.reload()
  }

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
    setSuddenlyIWasAwake(true)
    setInterval(() => {
      setNow(Date.now())
    }, 100)
    beginEntry()
  }

  function handleChangeDescription(changedDescriptionEvent: ChangeEvent<HTMLInputElement>) {
    setDescription(changedDescriptionEvent.target.value)
  }

  const dev = () => {
    console.log('Hello!')
  }

  function handleSubmit(submitEvent: ChangeEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    suddenlyIWasAwake && endEntry()
  }

  function rejectRequestDelete() {
    saveLocalStorageEntryList()
    setIsRequestDelete(false)
    setIsRequestDeleteConfirm(false)
  }

  useEffect(loadLocalStorageEntryList, [])

  return (
    <>
      <div>
        {!suddenlyIWasAwake && <button style={{ fontSize: 27 }} onClick={awaken}>Suddenly, I was awake.</button>}
      </div>
      <div>
        {/* <button onClick={dev}>HI!</button> */}
      </div>
      <div>
        <button onClick={saveLocalStorageEntryList}>Save Entry List to Local Storage</button>
      </div>
      <div>
        <button onClick={loadLocalStorageEntryList}>Load Entry List Local Storage</button>
      </div>
      <div>
        <button onClick={removeLocalStorageEntryList}>Remove Entry List from Local Storage</button>
      </div>
      <form onSubmit={handleSubmit}>
        <ul>
          {entryList.map((entry, i) => (
            <li key={i}>
              [{entry.elapsedTime}]: {entry.description}
            </li>
          ))}
          <li>
            [{suddenlyIWasAwake ? (now - startTime) : 0}]:
            <input value={description} onChange={handleChangeDescription} />
          </li>
        </ul>
      </form>
      {suddenlyIWasAwake && <button onClick={endEntry}>Close entry</button>}

      {isRequestDelete && !isRequestDeleteConfirm && (
        <>
          <div>Are you sure you want to remove this data?</div>
          <button onClick={confirmRequestDelete}>YES</button><button onClick={rejectRequestDelete}>No</button>
        </>
      )}
    </>
  )
}

export default App
