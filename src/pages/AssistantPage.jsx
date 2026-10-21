import { useState } from 'react';
import {
  Alert, Button, Chip, Stack, TextField, Typography, Paper, Table,
  TableHead, TableRow, TableCell, TableBody, TableContainer,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import SectionCard from '../components/common/SectionCard';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/date';

const SUGGESTIONS = [
  'Which wards had coverage below 90% yesterday?',
  'Which autos have pending dry-waste-centre visits?',
  "Why did Ward 112's coverage drop?",
  'Show overdue complaints in my ward',
  'Which black spots have remained unresolved the longest?',
];

export default function AssistantPage() {
  const { api } = useAppData();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      answer: 'Ask about coverage, DWC visits, complaints, or black spots. Answers come from local demo data only.',
      disclaimer: 'Not a connected AI service.',
      at: new Date().toISOString(),
    },
  ]);

  const ask = async (question) => {
    const q = (question || input).trim();
    if (!q) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', answer: q, at: new Date().toISOString() }]);
    setBusy(true);
    try {
      const res = await api.askAssistant(q, role, user);
      setMessages((m) => [...m, { role: 'assistant', ...res }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="AI Assistant" subtitle="Rule-based demo assistant querying the current sample dataset." />
      <Alert severity="info" icon={false}>
        Answers are generated locally from demo data — not a connected AI service.
      </Alert>

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} onClick={() => ask(s)} clickable disabled={busy} />
        ))}
      </Stack>

      <SectionCard title="Conversation" subtitle="Demo assistant" contentSx={{ minHeight: 320 }}>
        <Stack spacing={2}>
          {messages.map((m, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                p: 2,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                bgcolor: m.role === 'user' ? 'primary.main' : 'background.elevated',
                color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
              }}
            >
              {m.role === 'assistant' && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Bot size={16} />
                  <Typography variant="caption">Demo assistant</Typography>
                </Stack>
              )}
              <Typography variant="body2">{m.answer}</Typography>
              {m.table?.length > 0 && (
                <TableContainer sx={{ mt: 1, overflowX: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Table size="small" sx={{ minWidth: 280 }}>
                    <TableHead>
                      <TableRow>
                        {Object.keys(m.table[0]).map((k) => <TableCell key={k}>{k}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {m.table.map((row, ri) => (
                        <TableRow key={ri}>
                          {Object.values(row).map((v, vi) => <TableCell key={vi}>{String(v)}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {m.links?.map((l) => (
                <Button key={l.path} size="small" sx={{ mt: 1, mr: 1 }} onClick={() => navigate(l.path)}>{l.label}</Button>
              ))}
              {m.disclaimer && <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>{m.disclaimer}</Typography>}
              <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.6 }}>{formatDateTime(m.at)}</Typography>
            </Paper>
          ))}
        </Stack>
      </SectionCard>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'stretch' }}>
        <TextField
          fullWidth
          placeholder="Ask a question about demo data…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && ask()}
          disabled={busy}
        />
        <Button
          variant="contained"
          onClick={() => ask()}
          disabled={busy}
          startIcon={<Send size={16} />}
          sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Ask
        </Button>
      </Stack>
    </PageContainer>
  );
}
