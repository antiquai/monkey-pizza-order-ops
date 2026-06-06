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
      <AlertTitle>Adding Error</AlertTitle>
      <AlertDescription>
        Ooops! Something went wrong, please conntact Hotline!
      </AlertDescription>
    </Alert>
  )
}
