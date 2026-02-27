from decimal import Decimal
from django.conf import settings
from foodCreate.models import Products


class Cart(object):

    def __init__(self, request):
        self.session = request.session
        cart = self.session.get(settings.CART_SESSION_ID)
        if not cart:
            cart = self.session[settings.CART_SESSION_ID] = {}
        self.cart = cart

    @staticmethod
    def _effective_price(product):
        base = Decimal(str(product.price or 0))
        discount = getattr(product, "discount_price", None)
        if discount is not None:
            discount_value = Decimal(str(discount))
            if discount_value > 0 and (base <= 0 or discount_value < base):
                return discount_value
        return base

    def add(self, product, quantity=1, update_quantity=False):
        product_id = str(product.id)
        effective_price = self._effective_price(product)
        if product_id not in self.cart:
            self.cart[product_id] = {'quantity': 0,
                                      'price': str(effective_price)}
        else:
            # Keep session price aligned with current effective price.
            self.cart[product_id]['price'] = str(effective_price)

        if update_quantity:
            self.cart[product_id]['quantity'] = quantity
        else:
            self.cart[product_id]['quantity'] += quantity
        self.save()

    def save(self):
        self.session[settings.CART_SESSION_ID] = self.cart
        self.session.modified = True

    def remove(self, product):
        product_id = str(product.id)
        if product_id in self.cart:
            # self.cart[product_id]['quantity'] -= 1
            # # If the quantity is now 0, then delete the item
            # if self.cart[product_id]['quantity'] == 0:
            del self.cart[product_id]
            self.save()

    def __iter__(self):

        product_ids = [int(product_id) for product_id in self.cart.keys()]
        products = Products.objects.filter(id__in=product_ids)
        products_map = {product.id: product for product in products}
        for product_id, item in self.cart.items():
            row = item.copy()
            product = products_map.get(int(product_id))
            if product:
                row['product'] = product
                item_price = self._effective_price(product)
                # Persist refreshed effective price in session snapshot.
                self.cart[product_id]['price'] = str(item_price)
            else:
                item_price = Decimal(str(item['price']))
            row['price'] = item_price
            row['total_price'] = item_price * row['quantity']
            yield row

    def __len__(self):
        return sum(item['quantity'] for item in self.cart.values())

    def clear(self):
        self.session[settings.CART_SESSION_ID] = {}
        self.session.modified = True

    def get_total_price(self):
        product_ids = [int(product_id) for product_id in self.cart.keys()]
        products = Products.objects.filter(id__in=product_ids)
        products_map = {product.id: product for product in products}
        total = Decimal("0")
        for product_id, item in self.cart.items():
            product = products_map.get(int(product_id))
            if product:
                item_price = self._effective_price(product)
                self.cart[product_id]['price'] = str(item_price)
            else:
                item_price = Decimal(str(item['price']))
            total += item_price * item['quantity']
        return total
