"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

const DialogRoot = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close
const DialogBackdrop = DialogPrimitive.Backdrop
const DialogPopup = DialogPrimitive.Popup
const DialogTitle = DialogPrimitive.Title
const DialogDescription = DialogPrimitive.Description

const DialogBackdropStyled = React.forwardRef<
  React.ComponentRef<typeof DialogBackdrop>,
  React.ComponentPropsWithoutRef<typeof DialogBackdrop>
>(({ className, ...props }, ref) => (
  <DialogBackdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200",
      className
    )}
    {...props}
  />
))
DialogBackdropStyled.displayName = "DialogBackdrop"

const DialogPopupStyled = React.forwardRef<
  React.ComponentRef<typeof DialogPopup>,
  React.ComponentPropsWithoutRef<typeof DialogPopup>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogBackdropStyled />
    <DialogPopup
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg duration-200",
        "data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
        className
      )}
      {...props}
    >
      {children}
    </DialogPopup>
  </DialogPortal>
))
DialogPopupStyled.displayName = "DialogPopup"

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
}

function DialogTitleStyled({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogTitle
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescriptionStyled({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogDescription
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdropStyled as DialogBackdrop,
  DialogPopupStyled as DialogPopup,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitleStyled as DialogTitle,
  DialogDescriptionStyled as DialogDescription,
}
