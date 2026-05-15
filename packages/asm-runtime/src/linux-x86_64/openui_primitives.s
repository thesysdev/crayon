.text

.globl openui_strlen
.type openui_strlen, @function
openui_strlen:
  xor %rax, %rax
.L_strlen_loop:
  cmpb $0, (%rdi,%rax)
  je .L_strlen_done
  inc %rax
  jmp .L_strlen_loop
.L_strlen_done:
  ret

.globl openui_fnv1a64
.type openui_fnv1a64, @function
openui_fnv1a64:
  movabs $0xcbf29ce484222325, %rax
  movabs $0x100000001b3, %rcx
  test %rsi, %rsi
  je .L_fnv_done
.L_fnv_loop:
  movzbq (%rdi), %rdx
  xor %rdx, %rax
  imul %rcx, %rax
  inc %rdi
  dec %rsi
  jne .L_fnv_loop
.L_fnv_done:
  ret

.globl openui_find_byte
.type openui_find_byte, @function
openui_find_byte:
  xor %rax, %rax
  test %rsi, %rsi
  je .L_find_miss
.L_find_loop:
  cmpb %dl, (%rdi,%rax)
  je .L_find_hit
  inc %rax
  cmp %rax, %rsi
  jne .L_find_loop
.L_find_miss:
  mov $-1, %rax
.L_find_hit:
  ret
