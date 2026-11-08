import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MuiSnackbar from '@mui/material/Snackbar'

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
      <Alert
        severity={severity}
        onClose={onClose}
        action={
          action ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                onClose()
                action.onClick()
              }}
            >
              {action.label}
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </MuiSnackbar>
  )
}

export default Snackbar
