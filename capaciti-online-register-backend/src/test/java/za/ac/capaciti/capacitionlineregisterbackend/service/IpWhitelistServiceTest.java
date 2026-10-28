package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class IpWhitelistServiceTest {

    @Test
    void ignoresForwardedAddressFromUntrustedPeer() {
        IpWhitelistService service = new IpWhitelistService("10.0.0.0/8");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.25");
        request.addHeader("X-Forwarded-For", "203.0.113.42");

        assertEquals("198.51.100.25", service.extractClientIp(request));
    }

    @Test
    void extractsClientAddressThroughTrustedProxyChain() {
        IpWhitelistService service = new IpWhitelistService("10.0.0.0/8");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");
        request.addHeader("X-Forwarded-For", "203.0.113.42, 10.0.0.1");

        assertEquals("203.0.113.42", service.extractClientIp(request));
    }

    @Test
    void rejectsMalformedForwardedChainFromTrustedProxy() {
        IpWhitelistService service = new IpWhitelistService("10.0.0.0/8");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");
        request.addHeader("X-Forwarded-For", "203.0.113.42, unknown");

        assertNull(service.extractClientIp(request));
    }

    @Test
    void rejectsForwardedAddressWhenTrustedProxyOmitsHeader() {
        IpWhitelistService service = new IpWhitelistService("10.0.0.0/8");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");

        assertNull(service.extractClientIp(request));
    }

    @Test
    void rejectsInvalidTrustedProxyConfiguration() {
        assertThrows(IllegalArgumentException.class, () -> new IpWhitelistService("proxy.example.com"));
    }
}
