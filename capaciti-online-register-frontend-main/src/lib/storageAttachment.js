const supportedBuckets = new Set(['speed-test-screenshots', 'wfh-proof']);

export async function openSignedAttachment(value, getSignedUrl) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('This attachment does not have a supported storage URL.');
  }

  const marker = '/storage/v1/object/';
  const markerIndex = url.pathname.indexOf(marker);
  const parts = markerIndex < 0
    ? []
    : url.pathname.slice(markerIndex + marker.length).split('/');
  if (!['public', 'sign'].includes(parts[0]) || !supportedBuckets.has(parts[1]) || parts.length < 3) {
    throw new Error('This attachment is not stored in a supported private file bucket.');
  }

  const tab = window.open('about:blank', '_blank');
  if (!tab) throw new Error('Allow pop-ups to view this attachment.');
  tab.opener = null;
  try {
    const signed = await getSignedUrl(parts[1], decodeURIComponent(parts.slice(2).join('/')));
    tab.location.replace(signed.url);
  } catch (error) {
    tab.close();
    throw error;
  }
}
