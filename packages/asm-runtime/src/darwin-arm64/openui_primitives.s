.text
.align 2

.globl _openui_strlen
_openui_strlen:
  mov x1, x0
L_strlen_loop:
  ldrb w2, [x1], #1
  cbnz w2, L_strlen_loop
  sub x0, x1, x0
  sub x0, x0, #1
  ret

.globl _openui_fnv1a64
_openui_fnv1a64:
  mov x2, x0
  mov x3, x1
  ldr x0, L_fnv_offset_basis
  ldr x4, L_fnv_prime
  cbz x3, L_fnv_done
L_fnv_loop:
  ldrb w5, [x2], #1
  eor x0, x0, x5
  mul x0, x0, x4
  subs x3, x3, #1
  b.ne L_fnv_loop
L_fnv_done:
  ret

.align 3
L_fnv_offset_basis:
  .quad 0xcbf29ce484222325
L_fnv_prime:
  .quad 0x00000100000001b3

.globl _openui_find_byte
_openui_find_byte:
  mov x3, #0
  cbz x1, L_find_miss
L_find_loop:
  ldrb w4, [x0, x3]
  cmp w4, w2
  b.eq L_find_hit
  add x3, x3, #1
  cmp x3, x1
  b.lo L_find_loop
L_find_miss:
  mov x0, #-1
  ret
L_find_hit:
  mov x0, x3
  ret
