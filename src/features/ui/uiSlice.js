import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'ui', initialState: { search: '', priority: 'all', status: 'all' },
  reducers: { setSearch: (s, a) => { s.search = a.payload; }, setPriority: (s, a) => { s.priority = a.payload; }, setStatus: (s, a) => { s.status = a.payload; } },
});

export const { setSearch, setPriority, setStatus } = slice.actions;
export default slice.reducer;
