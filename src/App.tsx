import { Entry } from "./components/Entry"
import { HUD } from "./components/HUD"
import { LogBlock } from "./components/LogBlock"
import Refactor from "./components/Refactor"

function App() {
  console.log('um??')
  const data = localStorage.getItem('test')
  console.log('data should be nothing')
  console.log(data)
  const renderableData = data ? JSON.parse(data) : "empty"
  console.log('and renderable data should be empty')
  console.log(renderableData)

  if (!data) {
    console.log('and then we set local storage if it tmpty')
    localStorage.setItem('test', JSON.stringify({ render: "ok!" }))
  }

  console.log('and then we render the page')
  return (
    <>
      <div>{JSON.stringify(renderableData)}</div>
      On app open, load from local storage, then render:

      <div>an entry tab with task list helper</div>
      <div>a review tab with calendarlike interface</div>

      <HUD />
      <LogBlock />
      <Entry />
      <Refactor />
    </>
  )
}
export default App