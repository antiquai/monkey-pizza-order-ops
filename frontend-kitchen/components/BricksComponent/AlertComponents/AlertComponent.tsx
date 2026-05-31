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
      <AlertTitle>Order was succesfully sended to packstation</AlertTitle>
      <AlertDescription>
        Order was sent to packstation and will be packed and sended to customer soon !
      </AlertDescription>
    </Alert>
  )
}
