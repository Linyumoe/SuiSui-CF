package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// SSE event hub for note updates
const maxSSEClients = 100
var sseClients = make(map[chan string]bool)
var sseMu sync.Mutex

func sseBroadcast(event string, data string) {
	sseMu.Lock()
	defer sseMu.Unlock()
	msg := fmt.Sprintf("event: %s\ndata: %s\n\n", event, data)
	for ch := range sseClients {
		select {
		case ch <- msg:
		default:
			close(ch)
			delete(sseClients, ch)
		}
	}
}

func sseHandler(w http.ResponseWriter, r *http.Request) {
	rc := http.NewResponseController(w)
	rc.SetWriteDeadline(time.Time{})

	flusher, ok := w.(http.Flusher)
	if !ok {
		errResp(w, "streaming not supported", 500)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if _, err := fmt.Fprintf(w, ":ok\n\n"); err != nil {
		log.Printf("sse write :ok failed: %v", err)
	}
	flusher.Flush() // best-effort; Flush() has no return value

	sseMu.Lock()
	if len(sseClients) >= maxSSEClients {
		sseMu.Unlock()
		errResp(w, "too many connections", 503)
		return
	}
	sseMu.Unlock()

	ch := make(chan string, 3)
	sseMu.Lock()
	sseClients[ch] = true
	sseMu.Unlock()

	notify := r.Context().Done()
	go func() {
		<-notify
		sseMu.Lock()
		if _, ok := sseClients[ch]; ok {
			delete(sseClients, ch)
			close(ch)
		}
		sseMu.Unlock()
	}()

	for msg := range ch {
		if _, err := fmt.Fprint(w, msg); err != nil {
			log.Printf("sse write msg failed: %v", err)
			break
		}
		flusher.Flush() // best-effort; Flush() has no return value
	}
}
