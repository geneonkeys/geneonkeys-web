import { ChangeEvent, Fragment, MouseEvent, useEffect, useState, useCallback } from "react"

enum LocalStorageKeys {
  ENTRY_LIST = "ENTRY_LIST"
}

const App = () => {
  type Entry = {
    startTime: number
    elapsedTime: number
    description: string
    isSuddenlyAwakeEntry: boolean
  }

  const [isFirstAwakeEntry, setIsFirstAwakeEntry] = useState(false)
  const [isRequestDeleteConfirm, setIsRequestDeleteConfirm] = useState(false)
  const [isRequestDelete, setIsRequestDelete] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [suddenlyIWasAwake, setSuddenlyIWasAwake] = useState(0)
  const [entryList, setEntryList] = useState<Entry[]>([])
  const [startTime, setStartTime] = useState(0);
  const [description, setDescription] = useState("")

  function beginAndEndAwakeEntry() {
    if (isFirstAwakeEntry) {
      endEntry()
      setIsFirstAwakeEntry(false)
    }
  }



  const saveLocalStorageEntryList = useCallback((entries?: Entry[]) => {
    try {
      localStorage.setItem(LocalStorageKeys.ENTRY_LIST, JSON.stringify(entries ? entries : entryList))
    } catch (e) {
      console.log("Unable to save entry list to local storage.")
      console.log(e)
      localStorage.setItem(LocalStorageKeys.ENTRY_LIST, JSON.stringify([]))
    }
  }, [entryList])

  function loadLocalStorageEntryList() {
    try {
      const localStorageEntryListString = localStorage.getItem(LocalStorageKeys.ENTRY_LIST) ?? '';
      const localStorageEntryExists = Boolean(localStorageEntryListString);
      const localStorageEntryListObject = localStorageEntryExists ? JSON.parse(localStorageEntryListString) : null
      if (Array.isArray(localStorageEntryListObject)) {
        setEntryList(localStorageEntryListObject)
        return;
      }
      else {
        setEntryList([])
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

  const endEntry = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    const elapsedTime = Date.now() - startTime
    const isSuddenlyAwakeEntry = Math.abs(elapsedTime) < 100;
    const updatedEntries = [...entryList, {
      startTime,
      elapsedTime,
      description,
      isSuddenlyAwakeEntry
    }]
    setEntryList(updatedEntries)
    saveLocalStorageEntryList(updatedEntries)
    beginEntry()
  }, [description, entryList, saveLocalStorageEntryList, startTime])

  const awaken = () => {
    setSuddenlyIWasAwake(Date.now())
    setInterval(() => {
      setNow(Date.now())
    }, 100)

    setStartTime(Date.now(),)
    setDescription("Suddenly I was awake!")
    setIsFirstAwakeEntry(true)
  }

  function handleChangeDescription(changedDescriptionEvent: ChangeEvent<HTMLInputElement>) {
    setDescription(changedDescriptionEvent.target.value)
  }

  function handleSubmit(submitEvent: ChangeEvent<HTMLFormElement>) {
    submitEvent.preventDefault()
    if (suddenlyIWasAwake) {
      endEntry()
    }
  }

  function rejectRequestDelete() {
    saveLocalStorageEntryList()
    setIsRequestDelete(false)
    setIsRequestDeleteConfirm(false)
  }

  useEffect(beginAndEndAwakeEntry, [isFirstAwakeEntry, endEntry])
  useEffect(loadLocalStorageEntryList, [endEntry])

  return (
    <>
      <h1>Score: {entryList.length}</h1>
      <div>
        {!suddenlyIWasAwake && <button style={{ fontSize: 27 }} onClick={awaken}>Suddenly, I was awake.</button>}
      </div>

      <form onSubmit={handleSubmit}>
        <ul>
          {entryList.map((entry, i) => (
            <Fragment key={i}>
              {(entry.isSuddenlyAwakeEntry ?
                <li>
                  [{entry.startTime}]: {entry.description}
                </li> :
                <li>
                  [{entry.elapsedTime}]: {entry.description}
                </li>
              )}
            </Fragment>
          ))}
          <li>
            [{suddenlyIWasAwake !== 0 ? (now - startTime) : "---"}]:
            {suddenlyIWasAwake !== 0 ? <input autoFocus value={description} onChange={handleChangeDescription} /> : "---"}
            {suddenlyIWasAwake !== 0 ? <button onClick={endEntry}>LOG</button> : "---"}
          </li>
        </ul>
      </form>
      <div>
        <button onClick={removeLocalStorageEntryList}>CLEAR ALL ENTRIES</button>
      </div>
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
