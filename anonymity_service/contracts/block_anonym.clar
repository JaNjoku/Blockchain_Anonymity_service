;; Blockchain Anonymity Service

;; Define constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-initialized (err u101))
(define-constant err-not-initialized (err u102))

;; Define data variables
(define-data-var initialized bool false)
(define-data-var message-counter uint u0)

;; Define data maps
(define-map messages uint {sender: (optional principal), content: (string-utf8 500)})