package za.ac.capaciti.capacitionlineregisterbackend.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import za.ac.capaciti.capacitionlineregisterbackend.service.ITicketService;

@Component
public class TicketScheduler {
    private static final Logger log = LoggerFactory.getLogger(TicketScheduler.class);

    private final ITicketService ticketService;

    public TicketScheduler(ITicketService ticketService) {
        this.ticketService = ticketService;
    }

    @Scheduled(fixedDelay = 300000, initialDelay = 60000)
    public void flagProlongedTickets() {
        try {
            int count = ticketService.flagProlonged();
            if (count > 0) {
                log.info("{}", count);
            }
        } catch (Exception ex) {
            log.error("{}: {}", ex.getClass().getSimpleName(), ex.getMessage());
        }
    }
}
