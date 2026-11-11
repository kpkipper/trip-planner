import MuiSnackbar from '@mui/material/Snackbar'
import { CircleAlert, CircleCheck, X } from 'lucide-react'

export interface SnackbarAction {
  label: string
  onClick: () => void
}

interface SnackbarProps {
  open: boolean
  message: string
  severity?: 'success' | 'error'
  action?: SnackbarAction
  onClose: () => void
}

const Snackbar = ({ open, message, severity = 'success', action, onClose }: SnackbarProps) => {
  const Icon = severity === 'error' ? CircleAlert : CircleCheck
  return (
    <MuiSnackbar
      open={open}
      // A toast with a button stays long enough to use it and ignores outside clicks; errors
      // stay long enough to read.
      autoHideDuration={action ? 10000 : severity === 'error' ? 6000 : 1500}
      onClose={(_, reason) => {
        if (action && reason === 'clickaway') return
        onClose()
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {/* Dark pill (rounded-card = a full pill at one line, still tidy when it wraps). role="alert"
          as the MUI Alert it replaces, so it is announced. */}
      <div
        role="alert"
        className="flex max-w-full items-center gap-2.5 rounded-card bg-primary py-2 pl-4 pr-2 text-sm leading-normal text-white shadow-soft"
      >
        <Icon
          aria-hidden
          size={18}
          className={severity === 'error' ? 'shrink-0 text-danger' : 'shrink-0 text-live'}
        />
        <span className="min-w-0 break-words py-1">{message}</span>
        {action && (
          <button
            type="button"
            onClick={() => {
              onClose()
              action.onClick()
            }}
            className="shrink-0 rounded-full px-3 py-1 font-semibold whitespace-nowrap text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          title="Close"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={16} />
        </button>
      </div>
    </MuiSnackbar>
  )
}

export default Snackbar
