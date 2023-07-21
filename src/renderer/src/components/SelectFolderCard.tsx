import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"

export function SelectFolderCard(props: { select: () => void; folder: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project folder</CardTitle>
        <CardDescription>Root folder of your project.</CardDescription>
      </CardHeader>
      <CardContent className="font-mono">{props.folder}</CardContent>
      <CardFooter>
        <Button
          onClick={() => {
            props.select()
          }}
        >
          Select root folder
        </Button>
      </CardFooter>
    </Card>
  )
}
