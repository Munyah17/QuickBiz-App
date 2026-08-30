import type { PayrollRunDetail } from "@/services/payroll";

export function PayslipPrintArea({ run, orgName }: { run: PayrollRunDetail; orgName: string }) {
  return (
    <div className="print-area hidden print:block">
      {run.payslips.map((p) => (
        <div key={p.id} className="mb-8 break-after-page border border-black p-6 text-black">
          <div className="mb-4 flex items-center justify-between border-b border-black pb-2">
            <div>
              <p className="text-lg font-bold">{orgName}</p>
              <p className="text-sm">Payslip - {run.run_number}</p>
            </div>
            <div className="text-right text-sm">
              <p>
                Period: {new Date(run.period_start).toLocaleDateString()} to {new Date(run.period_end).toLocaleDateString()}
              </p>
              {run.pay_date && <p>Pay date: {new Date(run.pay_date).toLocaleDateString()}</p>}
            </div>
          </div>

          <div className="mb-4">
            <p className="font-semibold">{p.employeeName}</p>
            <p className="text-sm">Employee # {p.employeeNumber}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Earnings</th>
                <th className="py-1 text-right">Deductions</th>
              </tr>
            </thead>
            <tbody>
              {p.lines.map((l, i) => (
                <tr key={i} className="border-b border-dotted border-black/40">
                  <td className="py-1">{l.name}</td>
                  <td className="py-1 text-right">{l.type === "earning" ? l.amount.toFixed(2) : ""}</td>
                  <td className="py-1 text-right">{l.type === "deduction" ? l.amount.toFixed(2) : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-black font-semibold">
                <td className="py-1">Gross pay</td>
                <td className="py-1 text-right">{p.grossPay.toFixed(2)}</td>
                <td className="py-1 text-right" />
              </tr>
              <tr className="font-semibold">
                <td className="py-1">Total deductions</td>
                <td className="py-1 text-right" />
                <td className="py-1 text-right">
                  {(p.payeAmount + p.nssaEmployeeAmount + p.aidsLevyAmount + p.otherDeductions).toFixed(2)}
                </td>
              </tr>
              <tr className="border-t-2 border-black text-base font-bold">
                <td className="py-2">Net pay</td>
                <td className="py-2 text-right" colSpan={2}>
                  ${p.netPay.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
}
