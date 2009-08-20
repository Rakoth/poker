class CreatePurses < ActiveRecord::Migration
  def self.up
    create_table :purses do |t|
			t.string :type
      t.decimal :balance, :precision => 10, :scale => 2, :default => 0
      t.references :user

      t.timestamps
    end
  end

  def self.down
    drop_table :purses
  end
end
