const { readFileSync } = require('fs');
const { join } = require('path');

const card = readFileSync(join(__dirname, '..', 'src', 'components', 'FlyersTripCard.js'), 'utf8');
const page = readFileSync(join(__dirname, '..', 'src', 'pages', 'TravelEventPage.js'), 'utf8');

describe('flyer owner actions', () => {
  it('only exposes the download-card control to the flyer owner', () => {
    expect(card).toContain('{isOwner && onDownload ? (');
    expect(page).toContain('onDownload={isOwner ? handleDownload : undefined}');
  });
});
