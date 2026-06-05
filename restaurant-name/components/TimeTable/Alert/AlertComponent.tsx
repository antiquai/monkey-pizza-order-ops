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
      <AlertTitle>Timetable was uploaded </AlertTitle>
      <AlertDescription>
        The timetable has been successfully uploaded and is now available.
      </AlertDescription>
    </Alert>
  )
}
