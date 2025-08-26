# Frontend Development Notes

## Project Manager Feedback

_Notes from PM feedback sessions_

## Git Workflow

### Daily Workflow

```bash
# Start of day
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop  # Handle conflicts if any
```

### Before Creating PR

```bash
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop  # Ensure no conflicts
git push origin feature/your-branch
```

### Common Issues & Solutions

#### "Your branch is behind"

```bash
git pull origin feature/your-branch --rebase
```

#### "Failed to push - remote contains work"

```bash
git pull origin feature/your-branch
# Resolve conflicts, then push again
```

## Development TODOs

### Features to Implement

- [ ] Account settings
- [x] Add friends panel to profile
- [ ] Chat system
- [ ] Friend settings
- [ ] Tournament functionality
- [x] Match history

## Additional Notes

_Add any additional development notes here_
