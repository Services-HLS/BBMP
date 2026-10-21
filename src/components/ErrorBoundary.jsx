import { Component } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Paper sx={{ p: 4, maxWidth: 480, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>Something went wrong</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {this.state.error?.message || 'Unexpected UI error in the demo app.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
            >
              Reload app
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
