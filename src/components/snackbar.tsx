import Alert from '@mui/material/Alert'
import MuiSnackbar from '@mui/material/Snackbar'

interface SnackbarProps {
  open: boolean
  message: string
  severity?: 'success' | 'error'
  onClose: () => void
}

const Snackbar = ({ open, message, severity = 'success', onClose }: SnackbarProps) => {
  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={1500}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert severity={severity} onClose={onClose}>
        {message}
      </Alert>
    </MuiSnackbar>
  )
}

export default Snackbar
