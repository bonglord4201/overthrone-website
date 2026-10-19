# v8 premium rebuilds, one module per set (stage-by-stage). A set listed here is built by its own module instead of the
# shared sets5/sets6 builders; ids stay the same (overthrone:<set>_wings/_helm/_armor/_blade), so shop, crate and
# ownership are untouched.
import importlib
PREMIUM = {'celestial_sovereign': 'celestial9'}
def builders(sid):
    if sid not in PREMIUM: return None
    mod = importlib.import_module(PREMIUM[sid])
    return {'wings': lambda n, d: mod.wings(n), 'helm': lambda n, d: mod.helm(n), 'armor': lambda n, d: mod.armor(n), 'weapon': lambda n, d: mod.weapon(n)}
