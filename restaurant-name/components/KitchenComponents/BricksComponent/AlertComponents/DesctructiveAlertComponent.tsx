import { AlertCircleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const DectructiveAlertComponent = () => {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>Fetch Error</AlertTitle>
      <AlertDescription>
        Server Error! API is not responding. Please try again later.
      </AlertDescription>
    </Alert>
  )
}
