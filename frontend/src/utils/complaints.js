export function filterComplaints(complaints, status, search, fields) {
  const query = search.trim().toLowerCase();
  return complaints.filter((complaint) => {
    const matchesStatus = status === 'all' || complaint.status === status;
    const matchesSearch = !query || fields.some((field) => {
      const value = field.split('.').reduce((result, part) => result?.[part], complaint);
      return typeof value === 'string' && value.toLowerCase().includes(query);
    });
    return matchesStatus && matchesSearch;
  });
}
