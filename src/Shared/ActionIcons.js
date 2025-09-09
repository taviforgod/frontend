import { Pencil, Trash2, X, Download } from 'lucide-react';
import { IconButton, Tooltip, useTheme } from '@mui/material';

export const EditIcon = ({ onClick, bare = false }) => {
  const theme = useTheme(); // Access the current theme
  const icon = <Pencil size={18} />;

  if (bare) return icon;

  return (
    <Tooltip title="Edit">
      <IconButton
        onClick={onClick}
        sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'grey' }} // Adjust color based on theme
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export const DeleteIcon = ({ onClick, bare = false }) => {
  const theme = useTheme(); // Access the current theme
  const icon = <Trash2 size={18} />;

  if (bare) return icon;

  return (
    <Tooltip title="Delete">
      <IconButton
        onClick={onClick}
        sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'grey' }} // Adjust color based on theme
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export const CloseIcon = ({ onClick, bare = false }) => {
  const theme = useTheme(); // Access the current theme
  const icon = <X size={18} />;

  if (bare) return icon;

  return (
    <Tooltip title="Close">
      <IconButton
        onClick={onClick}
        sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'grey' }} // Adjust color based on theme
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};

export const DownloadIcon = ({ onClick, bare = false }) => {
  const theme = useTheme(); // Access the current theme
  const icon = <Download size={18} />;

  if (bare) return icon;

  return (
    <Tooltip title="Download">
      <IconButton
        onClick={onClick}
        sx={{ color: theme.palette.mode === 'dark' ? 'white' : 'grey' }} // Adjust color based on theme
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};
