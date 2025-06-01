import { Loader2 } from "lucide-react"

export function Loading() {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
}

export default Loading;
