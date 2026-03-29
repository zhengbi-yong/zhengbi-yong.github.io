import { ReactNode } from 'react'

interface TableWrapperProps {
  children: ReactNode
}

const TableWrapper = ({ children }: TableWrapperProps) => {
  return (
    <div className="w-full overflow-x-auto my-6">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
        {children}
      </table>
    </div>
  )
}

export default TableWrapper
