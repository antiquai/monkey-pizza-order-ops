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
      <AlertTitle>Creation Error</AlertTitle>
      <AlertDescription>
        Time Table for this week is already exists!
      </AlertDescription>
    </Alert>
  )
}
