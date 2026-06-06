import { CheckCircle2Icon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const AlertComponent = () => {
  return (
    <Alert className="max-w-md">
      <CheckCircle2Icon />
      <AlertTitle>Supply was saved into db</AlertTitle>
      <AlertDescription>
        Supply detailes was successfully uploaded into data base!
      </AlertDescription>
    </Alert>
  )
}
