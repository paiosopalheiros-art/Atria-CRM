import HouseLoader from "@/components/HouseLoader"

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <HouseLoader className="w-24 h-24 text-neutral-800 dark:text-neutral-100" />
    </div>
  )
}
