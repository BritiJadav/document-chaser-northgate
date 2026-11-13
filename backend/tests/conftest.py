import inspect

def run_coro(coro):
    if not inspect.iscoroutine(coro):
        return coro
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
