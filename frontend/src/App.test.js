import { filterComplaints } from './utils/complaints';
import { getHomePath } from './utils/session';
import { offerPasswordSave } from './utils/browserCredentials';

const complaints = [
  { title: 'Water leak', description: 'Pipe broken', category: 'water', village: 'North', status: 'pending' },
  { title: 'Street light', description: 'Lamp is out', category: 'electricity', village: 'South', status: 'in-progress' },
  { title: 'Road repair', description: 'Pothole', category: 'road', village: 'North', status: 'resolved' }
];

test.each([
  ['admin', '/admin'],
  ['citizen', '/dashboard'],
  [undefined, '/login']
])('maps the %s role to its portal path', (role, expectedPath) => {
  expect(getHomePath(role ? { role } : null)).toBe(expectedPath);
});

test('filters citizen complaints by status and searches the matching list', () => {
  const inProgress = filterComplaints(complaints, 'in-progress', '', ['title', 'village']);
  expect(inProgress.map((complaint) => complaint.title)).toEqual(['Street light']);

  const northReports = filterComplaints(complaints, 'all', 'north', ['title', 'village']);
  expect(northReports.map((complaint) => complaint.title)).toEqual(['Water leak', 'Road repair']);
});

test('searching administrator complaints includes nested citizen details', () => {
  const reports = [
    { title: 'Water leak', status: 'pending', citizen: { name: 'Asha Devi' } },
    { title: 'Road repair', status: 'pending', citizen: { name: 'Ravi Kumar' } }
  ];
  expect(filterComplaints(reports, 'all', 'asha', ['title', 'citizen.name'])).toEqual([reports[0]]);
});

test('offers successful email logins to the browser password manager', () => {
  const form = {};
  const PasswordCredentialType = jest.fn(function PasswordCredential(formElement) {
    this.form = formElement;
  });
  const credentialManager = { store: jest.fn().mockResolvedValue(undefined) };

  expect(offerPasswordSave(form, credentialManager, PasswordCredentialType)).toBe(true);
  expect(credentialManager.store).toHaveBeenCalledWith(expect.objectContaining({ form }));
});

test('does not fail login when browser password saving is unsupported', () => {
  expect(offerPasswordSave({}, {}, undefined)).toBe(false);
});
