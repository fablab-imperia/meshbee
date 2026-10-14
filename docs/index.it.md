---
title: MeshBee
description: Arnie intelligenti, reti radio comunitarie e tecnologia aperta per conoscere meglio le api e aiutare chi le alleva.
hide:
  - navigation
  - toc
---

<div class="mb-hero" markdown>

![MeshBee](/meshbee/assets/logo.svg){ .mb-hero-logo }

# Ascoltare l'alveare, anche da lontano {.mb-hero-title}

MeshBee è un sistema di monitoraggio per arnie nato al Fablab Imperia. Piccoli
dispositivi alimentati dal sole pesano l'alveare e ne misurano temperatura e umidità,
poi inviano i dati via radio fino al telefono dell'apicoltore. Anche dove il cellulare
non prende.
{ .mb-hero-lead }

[Scopri come funziona](#come-funziona){ .md-button .md-button--primary }
[Partecipa al progetto](contribute.md){ .md-button }

Un progetto di [Fablab Imperia APS](https://www.fablabimperia.org)
{ .mb-hero-byline }

</div>

![Nodi MeshBee installati sulle arnie in apiario](https://www.fablabimperia.org/blog/meshbee/arnie.jpg){ loading=lazy }

## Le api ci parlano dell'ambiente

Le api sono tra i migliori indicatori della salute di un territorio. Osservare un
alveare significa aiutare l'apicoltore nel suo lavoro, ma anche seguire da vicino
biodiversità, clima e stagioni.

Bastano pochi dati per capire molto:

- **Il peso** racconta se le api stanno raccogliendo nettare, se il miele è pronto,
  se la colonia ha sciamato o se sta finendo le scorte.
- **La temperatura interna** dice se la covata sta bene e se la famiglia riesce a
  scaldarsi e rinfrescarsi da sola.
- **L'umidità** aiuta a capire se l'arnia respira correttamente.
- **L'andamento nel tempo** mostra cosa è normale per quell'alveare, così ciò che
  non va salta subito all'occhio.

Di solito, per sapere tutto questo bisogna andare in apiario e aprire l'arnia. Con
MeshBee i dati arrivano da soli, e le api vengono disturbate meno.

## Perché un'altra arnia smart?

I sistemi commerciali esistono, ma spesso costano parecchio, richiedono una SIM e un
abbonamento, e funzionano male proprio nelle zone di campagna e di montagna dove
si trovano gli apiari. MeshBee prova a fare diversamente.

<div class="grid cards" markdown>

-   :material-sim-off:{ .lg .middle } **Niente SIM, niente abbonamenti**

    ---

    I dati viaggiano su onde radio a lunga distanza, non sulla rete telefonica.
    Funziona anche nelle valli senza copertura e non ha costi di gestione.

-   :material-white-balance-sunny:{ .lg .middle } **Si alimenta col sole**

    ---

    Un piccolo pannello solare e delle batterie ricaricabili rendono ogni dispositivo
    autonomo. Una volta installato, si lascia lavorare.

-   :material-piggy-bank-outline:{ .lg .middle } **A basso costo**

    ---

    Componenti elettronici comuni e un involucro stampato in 3D: un dispositivo costa
    meno di un centinaio di euro e può seguire più arnie insieme.

-   :material-hand-heart-outline:{ .lg .middle } **Aperto a tutti**

    ---

    Progetti, programmi e istruzioni sono liberi: chiunque può studiarli, costruirli,
    migliorarli. Nessuna dipendenza da aziende o piattaforme chiuse.

</div>

## Come funziona

1.  **Il dispositivo nell'arnia** si risveglia a intervalli regolari, misura peso,
    temperatura e umidità, invia i dati e torna a riposare per risparmiare energia.
2.  **Il messaggio passa di mano in mano.** I dati vengono trasmessi via radio con la
    tecnologia LoRa, che porta piccoli messaggi a chilometri di distanza consumando
    pochissimo. Ogni dispositivo della rete può ritrasmettere i messaggi degli altri,
    come in una staffetta.
3.  **Un punto di raccolta** collegato a internet riceve i dati e li salva.
4.  **Sul telefono** l'apicoltore vede grafici e andamento di ogni arnia, e riceve un
    avviso se qualcosa non va.

!!! tip "Una rete che cresce insieme alla comunità"

    MeshBee usa **Meshtastic**, una rete radio libera costruita da appassionati di tutto
    il mondo. Ogni nuovo dispositivo installato rafforza la rete per tutti: nella
    provincia di Imperia ce ne sono già decine.

## Fatto a mano, al Fablab

Ogni dispositivo è racchiuso in un tubo in PVC resistente alle intemperie, che contiene
moduli impilabili stampati in 3D: batteria, elettronica, radio e antenna, quest'ultima
autocostruita. Così è facile da montare, riparare e migliorare. Il progetto è stato
messo a punto un passo alla volta, provando i prototipi su arnie vere insieme agli
apicoltori della zona.

<div class="grid" markdown>

![MeshBee – foto 1](https://gateway.makerfairerome.eu/images/26/projects/51/photo_1.png){ loading=lazy }

![MeshBee – foto 2](https://gateway.makerfairerome.eu/images/26/projects/51/photo_3.png){ loading=lazy }

![MeshBee – foto 3](https://gateway.makerfairerome.eu/images/26/projects/51/photo_4.jpg){ loading=lazy }

![MeshBee – foto 4](https://gateway.makerfairerome.eu/images/26/projects/51/photo_5.jpg){ loading=lazy }

</div>

## Non solo api

Le stesse tecnologie possono servire a molto altro: stazioni meteo diffuse sul
territorio, monitoraggio ambientale, controllo di luoghi isolati, comunicazioni di
emergenza, progetti di scienza partecipata.

Per MeshBee le prossime idee sono ascoltare le vibrazioni e i suoni dell'alveare,
contare le api in entrata e in uscita, misurare la qualità dell'aria e confrontare
stagioni e apiari diversi.

!!! info "Vieni a vederlo dal vivo"

    MeshBee è tra i progetti in mostra al **Maker Faire Rome 2026**: ci trovi allo stand
    del Fablab Imperia, area V11 al Gazometro.
    [Scheda del progetto](https://makerfairerome.eu/espositori/?bb=51)

## Costruiamolo insieme

MeshBee è un progetto volontario del **Fablab Imperia APS**, dove maker, apicoltori e
appassionati di radio lavorano fianco a fianco. Che tu allevi api, ti piaccia
l'elettronica, la stampa 3D o semplicemente voglia saperne di più, c'è posto anche per te.

[Partecipa](contribute.md){ .md-button .md-button--primary }
[Visita il Fablab Imperia](https://www.fablabimperia.org){ .md-button }

Vuoi entrare nei dettagli tecnici? Trovi tutto nella [documentazione](overview.md).
